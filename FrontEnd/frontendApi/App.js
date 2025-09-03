import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import styles from "./css";

const API_BASE_URL = "http://localhost:3000";

const App = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    Nome: "",
    Idade: "",
    UF: "",
  });

  const loadClientes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setClientes(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      setClientes([]);
      Alert.alert("Erro", `Falha ao carregar clientes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Criar ou atualizar cliente
  const saveCliente = async () => {
    if (!formData.Nome || !formData.Idade || !formData.UF) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    try {
      let response;
      if (editingClient) {
        // Atualizar - usar ID maiúsculo
        const clienteId = editingClient.ID;

        if (!clienteId || isNaN(clienteId) || clienteId <= 0) {
          Alert.alert("Erro", "ID do cliente inválido para edição");
          return;
        }

        response = await fetch(`${API_BASE_URL}/clientes/${clienteId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Criar
        response = await fetch(`${API_BASE_URL}/clientes/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        Alert.alert(
          "Sucesso",
          editingClient ? "Cliente atualizado!" : "Cliente criado!"
        );
        closeModal();
        loadClientes();
      } else {
        Alert.alert("Erro", `Falha ao salvar cliente (${response.status})`);
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      Alert.alert("Erro", `Erro de conexão: ${error.message}`);
    }
  };

  // Chamar modal de excluir
  const confirmDeleteCliente = (cliente) => {
    setClienteToDelete(cliente);
    setDeleteModalVisible(true);
  };

  const executeDeleteCliente = async () => {
    if (!clienteToDelete) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/clientes/${clienteToDelete.ID}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        Alert.alert("Sucesso", "Cliente excluído com sucesso!");
        loadClientes();
      } else {
        Alert.alert("Erro", `Falha ao excluir cliente (${response.status})`);
      }
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      Alert.alert("Erro", `Erro de conexão: ${error.message}`);
    } finally {
      closeDeleteModal();
    }
  };

  // Fechar modal de confirmação de exclusão
  const closeDeleteModal = () => {
    setDeleteModalVisible(false);
    setClienteToDelete(null);
  };

  // Abrir modal para editar
  const editCliente = (cliente) => {
    if (!cliente) {
      console.error("Cliente inválido para edição");
      return;
    }

    setEditingClient(cliente);
    setFormData({
      Nome: cliente.Nome || "",
      Idade: (cliente.Idade ?? "").toString(),
      UF: cliente.UF || "",
    });
    setModalVisible(true);
  };

  // Abrir modal para criar
  const addCliente = () => {
    setEditingClient(null);
    setFormData({ Nome: "", Idade: "", UF: "" });
    setModalVisible(true);
  };

  // Fechar modal
  const closeModal = () => {
    setModalVisible(false);
    setEditingClient(null);
    setFormData({ Nome: "", Idade: "", UF: "" });
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const renderCliente = ({ item, index }) => {
    if (!item || typeof item !== "object") {
      return null;
    }

    const id = item.ID;
    const nome = item.Nome || "Nome não informado";
    const idade = item.Idade ?? "N/A";
    const uf = item.UF || "N/A";

    const isValidClient =
      id !== null && id !== undefined && !isNaN(id) && id > 0;

    return (
      <View style={styles.clienteCard}>
        <View style={styles.clienteInfo}>
          <Text style={styles.clienteNome}>{nome}</Text>
          <Text style={styles.clienteDetalhes}>
            Idade: {idade} | UF: {uf}
          </Text>
          <Text style={styles.clienteId}>ID: {id}</Text>
        </View>
        <View style={styles.clienteActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.editButton,
              !isValidClient && styles.disabledButton,
            ]}
            onPress={() => editCliente(item)}
            disabled={!isValidClient}
          >
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.deleteButton,
              !isValidClient && styles.disabledButton,
            ]}
            onPress={() => confirmDeleteCliente(item)}
            disabled={!isValidClient}
          >
            <Text style={styles.actionButtonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cadastro de Clientes</Text>
        <TouchableOpacity style={styles.addButton} onPress={addCliente}>
          <Text style={styles.addButtonText}>+ Novo Cliente</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={loadClientes}>
        <Text style={styles.refreshButtonText}>Atualizar Lista</Text>
      </TouchableOpacity>

      <FlatList
        data={clientes}
        renderItem={renderCliente}
        keyExtractor={(item, index) => {
          if (item && item.ID !== undefined && item.ID !== null) {
            return item.ID.toString();
          }
          return `cliente-${index}`;
        }}
        style={styles.list}
        refreshing={loading}
        onRefresh={loadClientes}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? "Carregando..." : "Nenhum cliente encontrado"}
            </Text>
          </View>
        }
      />
      {/* Modal criar e editar */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingClient ? "Editar Cliente" : "Novo Cliente"}
              </Text>

              <Text style={styles.label}>Nome:</Text>
              <TextInput
                style={styles.input}
                value={formData.Nome}
                onChangeText={(text) =>
                  setFormData({ ...formData, Nome: text })
                }
                placeholder="Digite o nome do cliente"
              />

              <Text style={styles.label}>Idade:</Text>
              <TextInput
                style={styles.input}
                value={formData.Idade}
                onChangeText={(text) =>
                  setFormData({ ...formData, Idade: text })
                }
                placeholder="Digite a idade"
                keyboardType="numeric"
              />

              <Text style={styles.label}>UF:</Text>
              <TextInput
                style={styles.input}
                value={formData.UF}
                onChangeText={(text) =>
                  setFormData({ ...formData, UF: text.toUpperCase() })
                }
                placeholder="Digite a UF (ex: SP)"
                maxLength={2}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={closeModal}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveCliente}
                >
                  <Text style={styles.saveButtonText}>
                    {editingClient ? "Atualizar" : "Salvar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal excluir */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirmar Exclusão</Text>

              <Text
                style={[
                  styles.label,
                  { textAlign: "center", marginBottom: 15 },
                ]}
              >
                Tem certeza que deseja excluir o cliente{"\n"}
                <Text style={{ color: "#f44336" }}>
                  {clienteToDelete?.Nome}
                </Text>
                ?
              </Text>

              <Text
                style={[
                  styles.clienteDetalhes,
                  { textAlign: "center", marginBottom: 25 },
                ]}
              >
                Esta ação não poderá ser desfeita.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={closeDeleteModal}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#f44336" }]}
                  onPress={executeDeleteCliente}
                >
                  <Text style={styles.saveButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default App;
